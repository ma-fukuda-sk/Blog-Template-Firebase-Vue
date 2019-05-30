import Vue from "vue";
import Router from "vue-router";
import BlogPost from "./components/BlogPost.vue";
import CreateBlog from "./components/CreateBlog.vue";
import Login from "./components/Login.vue";
import firebase from "./firebase.config.js";
import "firebase/auth";

Vue.use(Router);

const router = new Router({
  mode: "history",
  base: process.env.BASE_URL,
  routes: [{
      path: "/",
      name: "home",
      component: BlogPost,
      meta: {
        title: "Blog"
      }
    },
    {
      path: "/createBlog",
      name: "createBlog",
      component: CreateBlog,
      meta: {
        title: "Create blog"
      },
      beforeEnter: (to, from, next) => {
        var user = firebase.auth().currentUser;
        if (user) {
          next();
        } else {
          next("/login");
        }
      }
    },
    {
      path: "/login",
      name: "login",
      component: Login,
      meta: {
        title: "Login"
      }
    }
  ]
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title;
  next();
});

export default router;
