import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";

const MATCH_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

const pairKey = (patientId, doctorId) => `${patientId.toString()}|${doctorId.toString()}`;

export const syncCompletedAppointment = async (appointment) => {
  if (!appointment || appointment.status !== "completed") return;

  const date = new Date(appointment.appointmentDate);
  const start = new Date(date.getTime() - MATCH_WINDOW_MS);
  const end = new Date(start);
  end.setTime(date.getTime() + MATCH_WINDOW_MS);

  await Prescription.updateMany(
    {
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      followUpStatus: "scheduled",
      followUpDate: { $gte: start, $lt: end },
      isDeleted: false,
    },
    {
      $set: {
        followUpStatus: "completed",
        lastModifiedAt: new Date(),
      },
    }
  );
};

/**
 * Repair older prescription records whose matching appointment is already complete.
 */
export const syncCompletedFollowUps = async ({ patientId, doctorId } = {}) => {
  const filter = {
    followUpStatus: "scheduled",
    followUpDate: { $exists: true, $ne: null },
    isDeleted: false,
  };
  if (patientId) filter.patientId = patientId;
  if (doctorId) filter.doctorId = doctorId;

  const prescriptions = await Prescription.find(filter)
    .select("_id patientId doctorId followUpDate")
    .lean();
  if (prescriptions.length === 0) return;

  const dates = prescriptions.map((prescription) => new Date(prescription.followUpDate));
  const start = new Date(Math.min(...dates.map((date) => date.getTime())) - MATCH_WINDOW_MS);
  const end = new Date(Math.max(...dates.map((date) => date.getTime())) + MATCH_WINDOW_MS);

  const appointments = await Appointment.find({
    status: "completed",
    appointmentDate: { $gte: start, $lt: end },
    patientId: { $in: [...new Set(prescriptions.map((prescription) => prescription.patientId.toString()))] },
    doctorId: { $in: [...new Set(prescriptions.map((prescription) => prescription.doctorId.toString()))] },
  }).select("patientId doctorId appointmentDate").lean();

  const completedByPair = appointments.reduce((result, appointment) => {
    const key = pairKey(appointment.patientId, appointment.doctorId);
    const dates = result.get(key) || [];
    dates.push(new Date(appointment.appointmentDate).getTime());
    result.set(key, dates);
    return result;
  }, new Map());
  const completedPrescriptionIds = prescriptions
    .filter((prescription) => {
      const completedDates = completedByPair.get(pairKey(prescription.patientId, prescription.doctorId)) || [];
      const followUpTime = new Date(prescription.followUpDate).getTime();
      return completedDates.some((appointmentTime) => Math.abs(appointmentTime - followUpTime) <= MATCH_WINDOW_MS);
    })
    .map((prescription) => prescription._id);

  if (completedPrescriptionIds.length > 0) {
    await Prescription.updateMany(
      { _id: { $in: completedPrescriptionIds } },
      { $set: { followUpStatus: "completed", lastModifiedAt: new Date() } }
    );
  }
};
