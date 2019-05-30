<template>
  <v-app id="inspire">
    <v-content>
      <v-container fluid fill-height>
        <v-layout align-center justify-center>
          <v-flex xs12 sm8 md4>
            <v-card class="elevation-12">
              <v-toolbar dark color="primary">
                <v-toolbar-title>Login to Anna's blog</v-toolbar-title>
              </v-toolbar>
              <v-card-text>
                <v-form>
                  <v-text-field
                    prepend-icon="email"
                    name="login"
                    label="Login"
                    type="text"
                    v-model="email"
                  ></v-text-field>
                  <v-text-field
                    id="password"
                    prepend-icon="lock"
                    name="password"
                    label="Password"
                    type="password"
                    v-model="password"
                  ></v-text-field>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="login()" :loading="loading">Login</v-btn>
              </v-card-actions>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import firebase from "../firebase.config.js";
import "firebase/auth";

export default {
  data: () => ({
    email: null,
    password: null,
    loading: false
  }),
  async created() {},
  methods: {
    async login() {
      this.loading = true;
      await firebase
        .auth()
        .signInWithEmailAndPassword(this.email, this.password)
        .then(() => {
          this.$router.push("/createBlog");
        })
        .catch(function(error) {
          console.log(error.code);
          console.log(error.message);
        });
      this.loading = false;
    },
    async logout() {
      await firebase.auth().signOut();
      console.log("logged out");
    }
  }
};
</script>