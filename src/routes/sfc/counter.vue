<template>
  <div>
    <h1>Page Component</h1>
    <p>This is a sample page component.</p>
    <h2>Counter: {{ count }}</h2>
    <button @click="increment">Increment</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);

function increment() {
  count.value++;
}
</script>

<style scoped>
h1 {
  color: blue;
}
</style>
