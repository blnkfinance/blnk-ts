function GenerateRandomNumbersWithPrefix(prefix, count) {
  const randomNumbers = [];

  for (let i = 0; i < count; i++) {
    randomNumbers.push(Math.floor(Math.random() * 10)); // Generates a number between 0 and 9
  }

  const randomNumbersString = randomNumbers.join(``); // Joins the numbers into a string
  return `${prefix}-${randomNumbersString}`; // Combines the prefix with the random number string
}

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

module.exports = {
  GenerateRandomNumbersWithPrefix,
  sleep,
};
