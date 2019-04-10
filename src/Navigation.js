const { replace, push } = require("react-router-redux");
const qs = require("query-string");
const {
  setParams,
  goBack,
  clearNavigationStack,
  replaceStack,
  alreadyVisible
} = require("furmly-client");
const navigationMap = {
  Furmly: { path: "/home/furmly/:id", routeParams: ["id"] }
};
const extractLocationAndParams = function({ params, key }, context) {
  let loc = (context || navigationMap)[key];
  if (!loc) throw new Error("unknown navigation");
  if (loc.routeParams) {
    loc.routeParams.forEach(x => {
      if (!params[x]) throw new Error(`routeParam missing ${x}`);
    });
  }
  let path = loc.path
    .split("/")
    .map(x => {
      if (x.indexOf(":") !== -1) return params[x.substring(1)];
      return x;
    })
    .join("/");
  if (params.fetchParams) {
    path += `?${qs.stringify(params.fetchParams) +
      ((params.currentStep && `&currentStep=${params.currentStep}`) || "")}`;
  } else {
    if (params.currentStep) path += `?currentStep=${params.currentStep}`;
  }
  return path;
};

module.exports = class {
  constructor(dispatch, context) {
    this.dispatch = dispatch;
    this.context = context;
  }
  setParams(args) {
    let path = extractLocationAndParams(args, this.context);
    return this.dispatch(setParams(args)), this.dispatch(push(path));
  }
  replaceStack(arr, preserveData) {
    let path = extractLocationAndParams(arr[arr.length - 1], this.context);
    return (
      this.dispatch(replaceStack(arr, preserveData)),
      this.dispatch(replace(path))
    );
  }
  navigate(args) {
    let path = extractLocationAndParams(args, this.context);
    return this.dispatch(setParams(args)), this.dispatch(push(path));
  }
  goBack(args) {
    return this.dispatch(goBack(args));
  }
  clear() {
    return this.dispatch(clearNavigationStack());
  }
  alreadyVisible(args) {
    return this.dispatch(alreadyVisible(args));
  }
};
