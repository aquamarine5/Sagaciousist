import wnetwork from './wnetwork'

const BASE_LIBRARY="定位理论"

export class InteropPortalV2{
    /**
     * @param {string} esUrl 
     * @param {import('ollama').Ollama} ollamaInstance 
     */
    constructor(ollamaInstance,esUrl){
        this.ollama=ollamaInstance
        this.esUrl=esUrl
    }
    createOllama
    /**
     * 
     * @param {string} text 
     * @returns {Promise<import("ollama").AbortableAsyncIterator<import("ollama").GenerateResponse>>}
     */
    async generateChatRequest(text) {
        const messages = this.createBaseSystemPrompt().concat(await this.createESPrompt(text));
        return this.ollama.chat({
            model: 'llama3.1',
            stream: true,
            messages: messages
        });
    }
    /**
     * 
     * @param {string} text 
     * @returns {Promise<import('axios').AxiosResponse<any,any>}
     */
    getESPrompt(text){
        const ES_REQUEST_PATH="/materialSearch?query="
        return wnetwork.get(this.esUrl + ES_REQUEST_PATH + text)
    }
    /**
     * 
     * @param {string} text 
     * @returns {Promise<import('ollama').Message[]>}
     */
    async createESPrompt(text) {
        const response = await this.getESPrompt(text);
        let esPrompt = [];
        response.data[0].forEach(element => {
            esPrompt.push({
                role: 'user',
                content: element.title + element.content
            });
        });
        return esPrompt;
    }
    /**
     * 
     * @returns {import('ollama').Message[]}
     */
    createBaseSystemPrompt(){
        return [{
            role:'system',
            content:'除非提前指明，否则请使用中文回答。请不要使用Markdown的列表、**号进行文本强调粗体或斜体、*号来进行分条列点输出，1. 2.之类的进行分点，用汉字的第一第二代替。'
        },{
            role:'system',
            content:`假设你是一位研究${BASE_LIBRARY}方面的专家，你需要为青年大学生解决有关在阅读${BASE_LIBRARY}的过程中遇到的问题和困惑。`
        }]
    }
}