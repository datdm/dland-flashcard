import type { LessonsData } from "@/types";
import speedMasterN5 from "./speed-master-n5.json";
import superMasterN5 from "./n5-super-master.json";
// Thêm import khi có file mới:
// import n4 from "./n4.json";
// import n3 from "./n3.json";

/**
 * Tăng DATA_VERSION mỗi khi thêm bài học mới vào src/data/.
 * AutoImport sẽ tự động merge bài mới vào localStorage của user.
 */
export const DATA_VERSION = "1.1.3";

export const DEFAULT_VOCABULARY: LessonsData = {
  lessons: [
    // ...(speedMasterN5 as LessonsData).lessons,
    ...(superMasterN5 as LessonsData).lessons,
    // ...(n4 as LessonsData).lessons,
    // ...(n3 as LessonsData).lessons,
  ],
};
