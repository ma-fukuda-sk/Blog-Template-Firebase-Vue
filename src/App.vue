<template>
  <v-app>
    <v-content>
      <router-view></router-view>
    </v-content>
  </v-app>
</template>

<script>
import BlogPost from "./components/BlogPost";

export default {
  name: "App",
  components: {
    BlogPost
  },
  data() {
    return {
      //
    };
  }
};
</script>

<style>
</style>
