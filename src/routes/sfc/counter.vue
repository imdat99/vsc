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
  <Button label="Show" @click="visible = true" />

  <Dialog v-model:visible="visible" modal header="Edit Profile" :style="{ width: '25rem' }">
    <span class="text-surface-500 dark:text-surface-400 block mb-8">Update your information.</span>
    <div class="flex items-center gap-4 mb-4">
      <label for="username" class="font-semibold w-24">Username</label>
      <InputText id="username" class="flex-auto" autocomplete="off" />
    </div>
    <div class="flex items-center gap-4 mb-8">
      <label for="email" class="font-semibold w-24">Email</label>
      <InputText id="email" class="flex-auto" autocomplete="off" />
    </div>
    <div class="flex justify-end gap-2">
      <Button type="button" label="Cancel" severity="secondary" @click="visible = false"></Button>
      <Button type="button" label="Save" @click="visible = false"></Button>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { client } from '@/api/rpcclient';
import { uploadMultipartWithAbort } from '@/lib/chunkUpload';
import { ref } from 'vue';

import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
const visible = ref(false);
const count = ref(0);
const curl = ref('');
const inputFile = ref<File | null>(null);

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    uploadMultipartWithAbort(file, 4).then(() => {
      console.log('Upload completed');
    }).catch((err) => {
      console.error('Upload failed', err);
    });
  }
};

function generateUploadUrl() {
  client.presignedPut({ fileName: Math.random() + 'example.png', contentType: 'image/png' }).then(({ url, key }) => {
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
