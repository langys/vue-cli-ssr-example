import { createComponent } from "@vue/composition-api";
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'
import LogoImg from '../assets/logo.png'

export default createComponent({
  name: 'home',
  setup() {
    return () => (
      <div class="home">
        <img alt="Vue logo" src={LogoImg}></img>
        <h1>hot loading test</h1>
        <HelloWorld msg="Welcome to Your Vue.js App"></HelloWorld>
      </div>
    )
  }
})
