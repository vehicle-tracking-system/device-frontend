import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        connected: false,
        ws: null,
    },
    getters: {
        ws: function (state) {
            return state.ws
        },
        connected: function (state) {
            return state.connected
        },
    },
    mutations: {
        initWs(state, ws) {
            state.ws = ws
        },
        setConnected(state, connected) {
            state.connected = connected
        },
    }
})
