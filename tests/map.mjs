/* eslint-disable quotes */
export default testFile =>
  /^tests\/unit/.test(testFile)
    ? null
    : testFile.replace(/^tests\/unit/, "src");
