import PropTypes from 'prop-types';

export const getTagDataType = (isRequired = true) => {
  const tagDataTypeShape = {
    id: PropTypes.string,
    label: PropTypes.string,
    volume: PropTypes.number,
    type: PropTypes.string,
    sentiment: PropTypes.shape({
      negative: PropTypes.number,
      neutral: PropTypes.number,
      positive: PropTypes.number,
    }),
    sentimentScore: PropTypes.number,
    burst: PropTypes.number,
    days: PropTypes.arrayOf(PropTypes.shape({
      date: PropTypes.string.isRequired,
      volume: PropTypes.number.isRequired,
    })),
    pageType: PropTypes.shape({
      blog: PropTypes.number.isRequired,
      facebook: PropTypes.number.isRequired,
      forum: PropTypes.number.isRequired,
      general: PropTypes.number.isRequired,
      image: PropTypes.number.isRequired,
      news: PropTypes.number.isRequired,
      review: PropTypes.number.isRequired,
      twitter: PropTypes.number.isRequired,
      video: PropTypes.number.isRequired,
    }),
  };
  if (isRequired) {
    Object.keys(tagDataTypeShape).forEach(key => {
      tagDataTypeShape[key] = tagDataTypeShape[key].isRequired;
    });
  }

  return PropTypes.shape(tagDataTypeShape);
};
