import { apiInitializer } from "discourse/lib/api";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import { observes } from "discourse-common/utils/decorators";
import DiscourseURL from "discourse/lib/url";
import { set } from "@ember/object";

const PLUGIN_ID = 'discourse-loading-slider';

export default apiInitializer("0.8", (api) => {
  delete Ember.TEMPLATES["loading"];
  const { isAppWebview } = api.container.lookup("capabilities:main");

  api.modifyClass("route:application", {
    pluginId: PLUGIN_ID,
    loadingIndicator: service(),

    @action
    loading(transition) {
      this.loadingIndicator.start();
      transition.promise.finally(() => {
        this.loadingIndicator.end();
      });

      let superLoading = this._super();
      if (superLoading !== null) {
        return superLoading;
      }

      return true;
    },
  });



  api.modifyClass("component:topic-list-item", {
    pluginId: PLUGIN_ID,

    // Core updates the header with topic information as soon as a topic-list-item is clicked
    // This feels a little weird when the body is still showing old post content, so disable
    // that behavior.
    navigateToTopic(topic, href) {
      // this.appEvents.trigger("header:update-topic", topic); // This is the core line we're removing
      DiscourseURL.routeTo(href || topic.get("url"));
      return false;
    },
  });

  api.modifyClass("controller:discovery", {
    pluginId: PLUGIN_ID,

    set loading(value) {
      // no-op. We don't want the loading spinner to show on the discovery routes any more
    },
  });

  if (isAppWebview) {
    document.body.classList.add("discourse-hub-webview");
  }

  // Remove the custom refresh implementation and use the router
  api.modifyClass("controller:discovery/topics", {
    pluginId: PLUGIN_ID,

    @action
    refresh() {
      this.send("triggerRefresh");
    },
  });

  api.modifyClass("route:discovery", {
    pluginId: PLUGIN_ID,

    @action
    triggerRefresh() {
      this.refresh();
    },
  });
});
