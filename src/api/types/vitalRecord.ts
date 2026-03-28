/** Rails `VitalRecordsController` の JSON（snake_case）想定 */
export type VitalRecordRecord = {
  id: string;
  care_recipient_id: string;
  recorded_at: string;
  /** 体温（℃）。未測定は null */
  body_temperature: number | null;
  /** 最高血圧（収縮期）、mmHg */
  blood_pressure_systolic: number | null;
  /** 最低血圧（拡張期）、mmHg */
  blood_pressure_diastolic: number | null;
  /** 脈拍（bpm など、1分あたりの拍数） */
  pulse_rate: number | null;
  /** SpO₂（%） */
  spo2: number | null;
  memo: string | null;
  issue_status: string;
  created_at: string;
  updated_at: string;
};

export type VitalRecordWritePayload = {
  recorded_at: string;
  body_temperature: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  pulse_rate: number | null;
  spo2: number | null;
  memo: string | null;
  issue_status: string;
};
