<template>
  <v-container fluid>
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

    <v-container fluid v-show="isLoading==false">
      <v-container>
        <h3 class="mb-2 mt-2">Upload images</h3>
        <vue-dropzone
          class="mb-4"
          ref="dropzone"
          id="dz"
          :options="dropzoneOptions"
          @vdropzone-removed-file="removeImage"
        ></vue-dropzone>

        <v-flex xs6 sm4 md3 class="mb-4">
          <h3 class="mb-1">Choose name</h3>
          <v-text-field label="Name" v-model="name" class="mb-2"></v-text-field>
          <h3 class="mb-1">Choose category</h3>
          <v-combobox v-model="category" :items="categories" label="Category"></v-combobox>
        </v-flex>

        <h3 class="mb-2">Write your blog</h3>
        <editor
          api-key="gp2vyq7lub7qbfa6j2kfiz87lemsthuyngbk4cbmnhzqlknl"
          :init="{plugins: 'autoresize',branding: false, mobile: {
        theme:'mobile'
      }
      }"
          v-model="content"
        ></editor>
        <v-layout v-if="editMode==false" row wrap>
          <v-flex xs10 sm8 lg10>
            <v-btn color="success" @click="createBlog()" class="mt-4" :loading="uploading">
              Create blog
              <v-icon dark right v-if="done==false">add_circle</v-icon>
              <v-icon dark right v-else>check_circle</v-icon>
            </v-btn>
            <v-btn color="info" @click="cancelEdit()" class="mt-4" icon>
              <v-icon dark>cancel</v-icon>
            </v-btn>
          </v-flex>
          <v-flex xs4 sm4 lg2>
            <v-layout justify-end>
              <v-btn color="purple" @click="preview=true" class="mt-4" icon dark>
                <v-icon dark>visibility</v-icon>
              </v-btn>
              <v-btn color="grey" @click="saveDraft()" class="mt-4" icon dark>
                <v-icon dark>save</v-icon>
              </v-btn>
            </v-layout>
          </v-flex>
        </v-layout>
        <!-- edit mode -->
        <v-layout v-if="editMode" row wrap>
          <v-flex xs8 lg10>
            <v-btn color="warning" @click="updateBlog()" class="mt-4" :loading="uploading" icon>
              <v-icon dark v-if="done==false || deleted==true">edit</v-icon>
              <v-icon dark v-if="done && deleted == false">check_circle</v-icon>
            </v-btn>
            <v-btn color="error" @click="deleteBlog()" class="mt-4" :loading="deleting" icon>
              <v-icon dark v-if="done==false || deleted==false">delete</v-icon>
              <v-icon dark v-if="done && deleted">check_circle</v-icon>
            </v-btn>
            <v-btn color="info" @click="cancelEdit()" class="mt-4" icon>
              <v-icon dark>cancel</v-icon>
            </v-btn>
          </v-flex>
          <v-flex xs4 lg2>
            <v-layout justify-end>
              <v-btn color="purple" @click="preview=true" class="mt-4" icon dark>
                <v-icon dark>visibility</v-icon>
              </v-btn>
              <v-btn color="grey" @click="saveDraft()" class="mt-4" icon dark>
                <v-icon dark>save</v-icon>
              </v-btn>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-container>

      <!-- Floating Action Button -->

      <v-menu top left max-height="700">
        <template v-slot:activator="{ on }">
          <v-btn
            absolute
            dark
            fab
            top
            right
            color="pink"
            v-on="on"
            style="position:fixed;top:83%;right:5%;"
          >
            <v-icon>edit</v-icon>
          </v-btn>
        </template>

        <v-list v-if="blogData != null && blogData.length > 0">
          <v-list-tile v-for="(blog, i) in blogData" :key="i" @click="getBlog(blog)">
            <v-list-tile-title>
              <v-icon left>edit</v-icon>
              <span>{{blog.name}}</span>
            </v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>

      <!-- shows preview-->
      <v-dialog v-model="preview" width="800">
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
                <v-carousel-item
                  v-for="(test,i) in 3"
                  :key="i"
                  style="background-color:grey;"
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Antu_view-preview.svg/1000px-Antu_view-preview.svg.png"
                ></v-carousel-item>
              </v-carousel>

              <v-card-text class="mt-4">
                <template>
                  <span v-html="content"></span>
                </template>
              </v-card-text>
            </v-card>
          </v-flex>
        </v-layout>
      </v-dialog>
    </v-container>
  </v-container>
</template>

<script>
import firebase from "../firebase.config.js";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
import Editor from "@tinymce/tinymce-vue";
import vue2Dropzone from "vue2-dropzone";
import "vue2-dropzone/dist/vue2Dropzone.min.css";
import { callbackify } from "util";
import { setTimeout, setInterval } from "timers";

const sleep = m => new Promise(r => setTimeout(r, m));

export default {
  async created() {
    this.load();
    var res = false;
    var db = firebase.firestore();
    var draft = await db
      .collection("BlogDraft")
      .doc("BlogDraft")
      .get();
    console.log(draft);
    draft = draft.data();

    if (draft.body != "" && draft.body != undefined && draft.body != null) {
      res = await this.$confirm("Do you want to load recent draft?", {
        buttonTrueText: "Yes",
        buttonFalseText: "No",
        color: "info",
        icon: "info",
        title: "Draft",
        width: 350,
        property: "$confirm"
      });
    }
    if (res) this.getDraft();
    setInterval(() => {
      console.log("Saving draft...");
      var db = firebase.firestore();
      db.collection("BlogDraft")
        .doc("BlogDraft")
        .set({
          name: this.name,
          category: this.category,
          body: this.content
        });
    }, 30000);
  },
  components: {
    editor: Editor,
    vueDropzone: vue2Dropzone
  },

  data() {
    return {
      /*fetched data, don't reset them */
      categories: null,
      blogData: null,

      id: null,
      name: "",
      category: "",
      currentBlog: null,
      uploading: false,
      deleted: false,
      deleting: false,
      isLoading: true,
      editMode: false,
      justDrop: true,
      preview: false,
      done: false,
      content: "",
      dropzoneOptions: {
        thumbnailWidth: 150,
        addRemoveLinks: true,
        dictDefaultMessage: "Upload your images",
        url: "https://httpbin.org/post"
      }
    };
  },
  methods: {
    async load() {
      this.isLoading = true;
      var db = firebase.firestore();
      var data = [];
      var categoryData = new Set(["All"]);
      var blogPost = await db
        .collection("BlogPost")
        .orderBy("date", "desc")
        .get();
      blogPost.forEach(function(doc) {
        data.push(doc.data());
        categoryData.add(doc.data().category);
      });

      categoryData = Array.from(categoryData);
      this.categories = categoryData;
      this.blogData = data;

      this.isLoading = false;
    },
    async createBlog() {
      this.uploading = true;
      var imgFiles = this.$refs.dropzone.getAcceptedFiles();

      var imgUrls = [];
      for (var file of imgFiles) {
        var fileLocation = "images/" + file.name;
        var storageRef = firebase.storage().ref(fileLocation);
        await storageRef.put(file);
        var imgUrl = await storageRef.getDownloadURL();
        var imgData = {
          name: file.name,
          size: file.size,
          type: file.type
        };

        imgUrls.push({ data: imgData, url: imgUrl });
      }
      var db = firebase.firestore();
      var blogEntryLength = await db
        .collection("BlogPost")
        .get()
        .then(blogs => blogs.size);
      var timestamp = Date.now();
      var id = timestamp.toString();
      await db
        .collection("BlogPost")
        .doc(id)
        .set({
          images: imgUrls,
          body: this.content,
          category: this.category,
          date: timestamp,
          name: this.name,
          id: id
        });

      console.log("created blog...");
      this.uploading = false;
      this.done = true;
      await sleep(1000);
      this.load();
      this.reset();
    },
    async getBlog(blog) {
      console.log(this.blogData);
      this.isLoading = true;
      this.editMode = true;
      this.justDrop = false;
      this.currentBlog = blog;
      var blogCopy = JSON.parse(JSON.stringify(blog));
      var images = [];

      for (var image of blogCopy.images) {
        this.$refs.dropzone.manuallyAddFile(image.data, image.url);
      }

      this.id = blog.id;
      this.name = blog.name;
      this.category = blog.category;
      this.content = blog.body;
      tinymce.activeEditor.setContent(this.content);
      this.isLoading = false;
      console.log("fetched blog....");
    },
    async updateBlog() {
      console.log("edit mode...");
      this.uploading = true;
      var imgFiles = this.$refs.dropzone.getAcceptedFiles();

      var imgUrls = [];
      if (imgFiles.length > 0) {
        for (var file of imgFiles) {
          var fileLocation = "images/" + file.name;
          var storageRef = firebase.storage().ref(fileLocation);
          await storageRef.put(file);
          var imgUrl = await storageRef.getDownloadURL();
          var imgData = {
            name: file.name,
            size: file.size,
            type: file.type
          };

          this.currentBlog.images.push({ data: imgData, url: imgUrl });
        }
      }
      var db = firebase.firestore();

      this.currentBlog.name = this.name;
      this.currentBlog.category = this.category;
      this.currentBlog.body = this.content;

      await db
        .collection("BlogPost")
        .doc(this.currentBlog.id)
        .set(this.currentBlog);

      console.log("updated blog...");
      this.uploading = false;
      this.done = true;
      await sleep(1000);
      this.load();
      this.reset();
    },
    async deleteBlog() {
      let res = await this.$confirm("Do you really want to delete this blog?", {
        buttonTrueText: "No",
        buttonFalseText: "Yes",
        color: "error",
        icon: "warning",
        title: "Warning",
        width: 350,
        property: "$confirm"
      });
      if (res) return;
      this.deleting = true;
      var db = firebase.firestore();
      for (var image of this.currentBlog.images) {
        var fileLocation = "images/" + image.data.name;
        var storageRef = await firebase.storage().ref(fileLocation);
        storageRef
          .delete()
          .then(() => console.log("deleted image form firebase storage..."))
          .catch(e => console.log(e));
      }
      await db
        .collection("BlogPost")
        .doc(this.currentBlog.id)
        .delete()
        .then(() => console.log("deleted blog post..."))
        .catch(e => console.log(e));
      this.done = true;
      this.deleted = true;
      this.deleting = false;

      await sleep(1000);
      this.load();
      this.reset();
    },
    cancelEdit() {
      this.reset();
    },
    async getDraft() {
      var db = firebase.firestore();
      var draft = await db
        .collection("BlogDraft")
        .doc("BlogDraft")
        .get();
      console.log(draft);
      draft = draft.data();
      this.name = draft.name;
      this.category = draft.category;
      this.content = draft.body;
      tinymce.activeEditor.setContent(this.content);
    },
    saveDraft() {
      var db = firebase.firestore();
      db.collection("BlogDraft")
        .doc("BlogDraft")
        .set({
          name: this.name,
          category: this.category,
          body: this.content
        });
    },

    reset() {
      this.justDrop = true;
      this.$refs.dropzone.removeAllFiles();
      this.id = null;
      this.name = null;
      this.category = null;
      this.content = null;
      tinymce.activeEditor.setContent("");
      tinyMCE.activeEditor.undoManager.clear();
      this.currentBlog = null;
      this.uploading = false;
      this.deleted = false;
      this.deleting = false;
      this.editMode = false;
      this.done = false;
    },
    removeImage(file, error, xhr) {
      if (file.manuallyAdded == true && this.justDrop == false) {
        var fileLocation = "images/" + file.name;
        var storageRef = firebase.storage().ref(fileLocation);
        storageRef
          .delete()
          .then(() => console.log("deleted image form firebase storage..."))
          .catch(e => console.log(e));
        var images = this.currentBlog.images;
        for (var i = 0; i < images.length; i++) {
          console.log(images[i].data.name);
          console.log(file.name);
          if (images[i].data.name == file.name) {
            images.splice(i, 1);
            console.log("deleted...");
            break;
          }
        }
        this.currentBlog.images = images;
        var db = firebase.firestore();
        db.collection("BlogPost")
          .doc(this.currentBlog.id)
          .set(this.currentBlog);
      }
    }
  }
};
</script>

<style>
</style>
