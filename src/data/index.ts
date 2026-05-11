import type { CurriculumsData } from "@/types";
import superMasterN5Data from "./n5-super-master.json";
import speedMasterN5Data from "./speed-master-n5.json";

const superMasterN5 = superMasterN5Data as unknown as CurriculumsData;
const speedMasterN5 = speedMasterN5Data as unknown as CurriculumsData;
// Thêm import khi có file mới:
// import n4 from "./n4.json";
// import n3 from "./n3.json";

/**
 * Tăng DATA_VERSION mỗi khi thêm bài học mới vào src/data/.
 * AutoImport sẽ tự động merge bài mới vào localStorage của user.
 */
export const DATA_VERSION = "1.4.0";

// Import vocabulary data in native Curriculum format
// Thêm import khi có file mới:
// import n4 from "./n4.json";
// import n3 from "./n3.json";

export const DEFAULT_VOCABULARY: CurriculumsData = {
  curriculums: [
    ...superMasterN5.curriculums,
    // ...speedMasterN5.curriculums,
    // ...(n4 as CurriculumsData).curriculums,
    // ...(n3 as CurriculumsData).curriculums,
  ],
};
