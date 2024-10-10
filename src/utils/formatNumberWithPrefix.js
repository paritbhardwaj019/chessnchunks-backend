function formatNumberWithPrefix(prefix, number) {
  const incrementedNumber = number + 1;

  const formattedNumber = String(incrementedNumber).padStart(3, '0');

  return `${prefix}${formattedNumber}`;
}

module.exports = formatNumberWithPrefix;
