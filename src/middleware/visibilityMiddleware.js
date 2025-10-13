module.exports = function setVisibility(visibility = 'public') {
  return (req, res, next) => {
    req.visibility = visibility; // 'public' | 'admin'
    next();
  };
};
