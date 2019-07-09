const React = require("react");
const { connect } = require("react-redux");
const { replace } = require("react-router-redux");
const qs = require("query-string");
const NAV_KEY = "Furmly";
module.exports = function(
  map,
  NestedComponent,
  loginUrl = "/",
  homeUrl = "/home"
) {
  function mapDispatchToProps(dispatch) {
    return { dispatch };
  }
  function mapStateToProps(state) {
    return {
      stack: state.furmly.navigation.stack,
      references: state.furmly.navigation._references
    };
  }
  class Base extends React.Component {
    constructor(props) {
      super(props);
      this.goBack = this.goBack.bind(this);
      this.noPlaceToGo = this.noPlaceToGo.bind(this);
      this.oneStepBack = this.oneStepBack.bind(this);
      this.openProcess = this.openProcess.bind(this);
      this.backToLogin = this.backToLogin.bind(this);
      this.getParamsFromUrl = this.getParamsFromUrl.bind(this);
      this.refreshStack = this.refreshStack.bind(this);
      this.del = "?";
    }
    componentWillMount() {
      window.onhashchange = ({ newURL, oldURL }) => {
        const [nUrl, nQuery] = newURL.split(this.del);
        const [oUrl, oQuery] = oldURL.split(this.del);
        const { currentStep: nStep = "0" } = qs.parse(nQuery);
        const { currentStep: oStep = "0" } = qs.parse(oQuery);
        const nStepInt = parseInt(nStep);
        const oStepInt = parseInt(oStep);

        if (nUrl !== oUrl || (nUrl == oUrl && nStepInt < oStepInt)) {
          // modify this function to do nothing if there is only one one item left in the stack if at home
          // and navigate backwards if it is outside.
          if (this.noPlaceToGo()) {
            if (NestedComponent.shouldClearStackOnEmpty) {
              window.onpopstate = null;
              this.props.furmlyNavigator.clearStack();
              return;
            }
          } else this.oneStepBack();
        }

        if (nUrl == oUrl && nStepInt > oStepInt) {
          //user is manipulating the url to skip steps.
          const top = this.props.stack[this.props.stack.length - 1];
          if (nStepInt !== top.params.currentStep) {
            this.refreshStack(top);
          }
        }
      };

      if (!this.props.stack.length && NestedComponent.pushVisible) {
        this.props.furmlyNavigator.visible({
          key: NAV_KEY,
          params: this.getParamsFromUrl()
        });
        return;
      }
      //if the stack does not jive with the current location then replace the stack;
      if (this.props.stack.length) {
        const current = this.getParamsFromUrl();
        const top = this.props.stack[this.props.stack.length - 1];
        if (
          top.params.id !== current.id ||
          (top.params.currentStep !== current.currentStep &&
            !(
              typeof top.params.currentStep == "undefined" &&
              current.currentStep == 0
            ))
        ) {
          this.refreshStack(top);
        }
      }
    }
    refreshStack(top) {
      const { id, fetchParams, currentStep } = top.params;
      const newStack = this.props.stack.slice();
      newStack.pop();
      newStack.push({
        ...top,
        params: { id, fetchParams, currentStep }
      });
      this.props.furmlyNavigator.replaceStack(newStack, true);
    }
    getParamsFromUrl() {
      let [urlSegment, query] = location.href.split(this.del);
      let url = urlSegment.split("/");
      let { currentStep, ...rest } = qs.parse(query);
      return Object.assign(
        { id: url[url.length - 1] },
        { currentStep: parseInt(currentStep) || 0, ...rest }
      );
    }
    openProcess(item, shouldPush) {
      if (item.type == "FURMLY") {
        let arr = [
          {
            key: NAV_KEY,
            params: Object.assign(
              { id: item.value },
              { fetchParams: qs.parse(item.params || "") }
            )
          }
        ];
        return !shouldPush
          ? this.props.furmlyNavigator.replaceStack(arr)
          : this.props.furmlyNavigator.navigate(arr[0]);
      }
      this.props.furmlyNavigator.clearStack();
      window.location.hash = `${homeUrl}/${item.value}`;
    }
    componentWillUnmount() {}
    backToLogin() {
      this.props.furmlyNavigator.clearStack();
      this.props.dispatch(replace(loginUrl));
    }
    goBack() {
      if (this.noPlaceToGo()) {
        return this.props.history.goBack();
      } else {
        return this.oneStepBack();
      }
    }
    noPlaceToGo() {
      return this.props.stack.length == 0 || this.props.stack.length == 1;
    }
    oneStepBack() {
      return this.props.furmlyNavigator.goBack({
        item: this.props.stack[this.props.stack.length - 1],
        references: this.props.references
      });
    }

    render() {
      return React.createElement(NestedComponent, {
        location: this.props.location,
        emptyStack: !!!this.props.stack.length,
        openProcess: this.openProcess,
        match: this.props.match,
        backToLogin: this.backToLogin
      });
    }
  }
  return {
    getComponent: () =>
      connect(
        mapStateToProps,
        null
      )(map.withNavigation(Base)),
    Base,
    mapDispatchToProps,
    mapStateToProps
  };
};
