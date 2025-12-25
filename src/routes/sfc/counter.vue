<template>
  <div>
    <h1>Page Component</h1>
    <p>This is a sample page component.</p>
    <h2>Counter: {{ count }}</h2>
    <pre>Presigned URL: {{ curl }}</pre>
    <button @click="generateUploadUrl">Generate Presigned Upload URL</button>
    <input type="file" ref="inputFile" @change="onFileChange" />
    <!-- <button class="btn btn-primary" @click="chunkedUpload">Chunked Upload</button> -->
  </div>
</template>

<script setup lang="ts">
import { client } from '@/api/rpcclient';
import { ref } from 'vue';

const count = ref(0);
const curl = ref('');
const inputFile = ref<File|null>(null);

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    client.chunkedUpload(file.name, file.type, file.size).then((res) => {
      console.log('Presigned URL:', res.UploadId);
      // curl.value = res.UploadId;
    });
  }
};

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
