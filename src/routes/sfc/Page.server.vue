<script setup lang="ts">
import { VueHead } from "@/components/Layout/Head";
import ClientSlot from "../_slot.vue";
</script>

<template>
  <VueHead :input="{ title: 'Debug Page Server Component' }" />
  <div>
    <ClientSlot>
      <div>hello</div>
    </ClientSlot>
    <h1>Page Server Component</h1>
    <p>This is a sample page component.</p>
  </div>
</template>