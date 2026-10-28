export const PACE_LIMIT_SEC = 2 * 60 + 30;
export const DISTANCE_LIMIT_KM = 80;

export function detectFlags(input: {
  distanceKm: number;
  durationSec: number;
  paceSecPerKm?: number;
  calories: number;
}) {
  const flags: string[] = [];
  const calculated =
    input.distanceKm > 0 && input.durationSec > 0
      ? input.durationSec / input.distanceKm
      : undefined;
  const pace = input.paceSecPerKm && input.paceSecPerKm > 0 ? input.paceSecPerKm : calculated;

  if (pace !== undefined && pace < PACE_LIMIT_SEC) {
    flags.push("เพซเร็วกว่า 2:30 นาที/กม.");
  }
  if (input.distanceKm > DISTANCE_LIMIT_KM) {
    flags.push("ระยะทางต่อครั้งเกิน 80 กม. ซึ่งสูงผิดปกติสำหรับรายการเดียว");
  }
  if (
    calculated !== undefined &&
    input.paceSecPerKm !== undefined &&
    input.paceSecPerKm > 0 &&
    Math.abs(calculated - input.paceSecPerKm) > 20
  ) {
    flags.push("เพซที่กรอกไม่ตรงกับระยะทางและเวลา");
  }
  if (input.distanceKm > 0 && input.calories > input.distanceKm * 250) {
    flags.push("แคลอรี่สูงผิดสัดส่วนเมื่อเทียบกับระยะทาง");
  }
  return flags;
}
