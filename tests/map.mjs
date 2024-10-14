/* eslint-disable quotes */
export default testFile =>
  /^tests\/e2e/.test(testFile) ? null : testFile.replace(/^tests\/unit/, "src");
