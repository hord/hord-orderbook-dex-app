import web3 from "../../bootstrap/web3";

const normalize = (value, previousValue) => {
  console.log('normalize', value, previousValue);
  return  ['0',0, ''].includes(value)
    ? value
    : !isFinite(value)
      ? previousValue
      : value
          .replace(/,/g, "")
        .replace(/^0{2,}/, "0")
          .replace(/[^\d.\\-]/g, "")
          .replace(/\.{2,}/, "")
          .toString();
};

const formatValue = value =>
  isFinite(value)
    ? web3.toBigNumber(value.replace(/\.$/, "")).toFormat(5)
    : "0";

const numericFormatValidator = value => {
  if (!/^(\d+\.?\d*|\.\d+)$/.test(value)) {
    return `VALIDATOR_ERROR/NOT_NUMERIC_FORMAT`;
  }
};

const greaterThanZeroValidator = value => {
  if (!(isFinite(value) && web3.toBigNumber(value).gt(0))) {
    return `VALIDATOR_ERROR/MUST_BE_GREATER_THAN_ZERO`;
  }
};

export {
  normalize,
  formatValue,
  numericFormatValidator,
  greaterThanZeroValidator
};
