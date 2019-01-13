const Navigator = require("./Navigation");
const Page = require("./Page");

module.exports = maps => {
  //Creates a furmly page.
  maps.createPage = (WrappedComponent, context, ...args) =>
    maps._defaultMap
      .PROVIDER(
        maps.withNavigationProvider(
          Page(
            WrappedComponent,
            config.loginUrl,
            config.homeUrl
          ).getComponent(),
          Navigator,
          context
        ),
        ...args
      )
      .getComponent();
};