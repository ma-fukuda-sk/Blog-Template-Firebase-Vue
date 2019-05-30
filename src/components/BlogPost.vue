<template>
  <v-container fluid>
    <!-- toolbar -->
    <v-toolbar
      app
      height="75"
      flat
      style="border-bottom: 1px solid 	#E6E6E6; background-color:white"
    >
      <v-layout row fill-height align-center>
        <v-flex xs4>
          <v-menu bottom right>
            <template v-slot:activator="{ on }">
              <v-btn icon v-on="on">
                <v-icon>sort</v-icon>
              </v-btn>
            </template>

            <v-list v-if="true">
              <v-list-tile v-for="(item, i) in category" :key="i" @click="getCategory(item)">
                <v-list-tile-title>{{item}}</v-list-tile-title>
              </v-list-tile>
            </v-list>
          </v-menu>
        </v-flex>
        <v-flex class="text-xs-center font-weight-regular font-italic title">
          <span>{{blogName}}</span>
        </v-flex>
        <v-flex xs4></v-flex>
      </v-layout>
    </v-toolbar>

    <!-- loading indicator -->
    <v-container v-if="isLoading">
      <v-progress-circular
        :size="50"
        color="primary"
        indeterminate
        absolute
        style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);"
      ></v-progress-circular>
    </v-container>
    <!-- content -->
    <v-layout justify-center row class="mt-4" v-if="isLoading==false">
      <v-flex xs12 lg6>
        <v-container fluid grid-list-xl>
          <v-layout row wrap>
            <v-flex
              v-for="(blog,i) in blogData"
              :key="i"
              xs6
              sm4
              lg4
              id="select"
              @click="details(blog)"
            >
              <img :src="blog.images[0].url" class="image" alt="blog" width="100%" height="100%">
            </v-flex>
          </v-layout>
        </v-container>
      </v-flex>
    </v-layout>

    <!-- shows detailed view with blog text-->
    <v-dialog v-model="showDetails" width="800" v-if="currentBlog!=null">
      <v-layout align-center>
        <v-flex>
          <v-card>
            <v-carousel
              hide-delimiters
              height="100%"
              width="100%"
              :cycle="false"
              style="box-shadow:none"
            >
              <v-carousel-item v-for="(image,i) in currentBlog.images" :key="i" :src="image.url"></v-carousel-item>
            </v-carousel>

            <v-card-text class="mt-4">
              <template>
                <span v-html="currentBlog.body"></span>
              </template>
            </v-card-text>
          </v-card>
        </v-flex>
      </v-layout>
    </v-dialog>
  </v-container>
</template>

<script>
import firebase from "../firebase.config.js";
import "firebase/firestore";

export default {
  data() {
    return {
      blogName: "BlOG NAME HERE",
      showDetails: false,
      isLoading: true,
      blogData: null,
      currentBlog: null,
      category: null
    };
  },

  async created() {
    var db = firebase.firestore();
    var data = [];
    var categoryData = new Set(["All"]);
    var blogPost = await db
      .collection("BlogPost")
      .orderBy("date", "desc")
      .get();
    blogPost.forEach(function(doc) {
      data.push(doc.data());
      console.log(doc.data());
      categoryData.add(doc.data().category);
    });

    this.category = categoryData;
    this.blogData = data;
    this.isLoading = false;
  },

  methods: {
    details(blog) {
      this.currentBlog = blog;
      this.showDetails = true;
    },
    async getCategory(category) {
      this.isLoading = true;
      var db = firebase.firestore();
      var data = [];
      if (category == "All") {
        var blogPost = await db
          .collection("BlogPost")
          .orderBy("date", "desc")
          .get();
        blogPost.forEach(function(doc) {
          data.push(doc.data());
        });

        this.blogData = data;
        this.isLoading = false;
      } else {
        var blogPost = await db
          .collection("BlogPost")
          .where("category", "==", category)
          .orderBy("date", "desc")
          .get();
        blogPost.forEach(function(doc) {
          data.push(doc.data());
        });

        this.blogData = data;
        this.isLoading = false;
      }
    }
  }
};
</script>

<style>
#select:hover {
  filter: brightness(70%);
}

html {
  overflow: scroll;
  overflow-x: hidden;
}
::-webkit-scrollbar {
  width: 0px; /* Remove scrollbar space */
  background: transparent; /* Optional: just make scrollbar invisible */
}
/* Optional: show position indicator in red */
::-webkit-scrollbar-thumb {
  background: #ff0000;
}
</style>
