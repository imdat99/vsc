<template>
    <vue-head :input="{ title: 'Login - EcoStream', meta: [
        { name: 'description', content: 'Login to your EcoStream account to manage your video infrastructure, monitor analytics, and access developer tools.' }
    ] }" />
    <div id="page-login" class="fade-in min-h-[calc(100vh-80px)] flex items-center justify-center bg-slate-50">
             <div class="absolute inset-0 bg-grid-pattern opacity-[0.3]"></div>
             <div class="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 m-4">
                 <div class="text-center mb-8">
                     <div class="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-brand-600">
                         <i class="fas fa-user-lock text-xl"></i>
                     </div>
                     <h2 class="text-2xl font-bold text-slate-900">Welcome back</h2>
                     <p class="text-slate-500 text-sm mt-2">Enter your details to access your account</p>
                 </div>
                 
                 <form class="space-y-5" onsubmit="event.preventDefault();">
                     <div>
                         <label class="block text-sm font-medium text-slate-700 mb-1">Email</label>
                         <input type="email" placeholder="name@company.com" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-sm">
                     </div>
                     <div>
                         <div class="flex justify-between items-center mb-1">
                             <label class="block text-sm font-medium text-slate-700">Password</label>
                             <a href="#" onclick="showPage('forgot')" class="text-xs font-semibold text-brand-600 hover:text-brand-500">Forgot password?</a>
                         </div>
                         <input type="password" placeholder="••••••••" class="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-sm">
                     </div>
                     <Button class="">Login</Button>
                     <!-- <button class="w-full py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-black transition-all">Login</button> -->
                     <!-- <button class="w-full py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-black transition-all">Sign in with Google</button> -->
                 </form>

                 <div class="mt-8 text-center text-sm text-slate-500">
                     Don't have an account? <a href="#" onclick="showPage('signup')" class="font-semibold text-brand-600 hover:text-brand-500">Sign up now</a>
                 </div>
             </div>
        </div>

</template>
<script lang="ts" setup>  
import { VueHead } from '@/components/Layout/Head';
import Button from 'primevue/button';
</script>