<template>
  <div>
    <h1>Page Component</h1>
    <p>This is a sample page component.</p>
    <h2>Counter: {{ count }}</h2>
    <pre>Presigned URL: {{ curl }}</pre>
    <button @click="generateUploadUrl">Generate Presigned Upload URL</button>
    <button @click="increment">Increment</button>
  </div>
</template>

<script setup lang="ts">
import { client } from '@/api/rpcclient';
import { ref } from 'vue';

const count = ref(0);
const curl = ref('');
function generateUploadUrl() {
 client.presignedPut({ fileName: Math.random()+'example.png', contentType: 'image/png' }).then(({url, key}) => {
   console.log('Presigned URL:', url);
   curl.value = url;
 }); 
}
function increment() {
  count.value++;
}
</script>

<style scoped>
h1 {
  color: blue;
}
</style>
