const detectLangsFromJSON = require("../src/detectors/detectorJSON")
const path = require("path")
describe("DetectLangsFromJSON", ()=>{
    test("Correctly Identifies Languages 1", ()=>{
       expect(
         detectLangsFromJSON([], path.resolve("tests", "skills-icons.json"))
       ).toStrictEqual({
         frameworks: [],
         languages: {
           Dockerfile: { bytes: 536, bytesPercent: "4.67", files: 1 },
           TypeScript: { bytes: 10937, bytesPercent: "95.33", files: 3 },
         },
         other: { JSON: { bytes: 238, files: 1 } },
         totals: {
           languageBytes: 11473,
           otherBytes: 238,
           totalBytes: 11711,
           totalFiles: 702,
         },
       });
    })
    test("Correctly Identifies Languages 2", () => {
      expect(
        detectLangsFromJSON([], path.resolve("tests", "GitProfileStats.json"))
      ).toStrictEqual({
        frameworks: ["React"],
        languages: {
          JavaScript: { files: 2, bytes: 1930, bytesPercent: "5.91" },
          HTML: { files: 1, bytes: 466, bytesPercent: "1.43" },
          CSS: { files: 4, bytes: 8081, bytesPercent: "24.75" },
          "JavaScript (JSX)": {
            files: 10,
            bytes: 22173,
            bytesPercent: "67.91",
          },
        },
        other: { JSON: { files: 1, bytes: 424 } },
        totals: {
          totalFiles: 30,
          languageBytes: 32650,
          otherBytes: 424,
          totalBytes: 33074,
        },
      });
    });
})
