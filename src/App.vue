<template>
  <div class="app-shell">
    <nav class="nav">
      <router-link to="/login">Login</router-link>
      <router-link to="/home">Home</router-link>
    </nav>

    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
}

.app-shell {
  padding: 16px;
}

.nav {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
