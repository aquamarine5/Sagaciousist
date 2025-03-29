/*
 * @Author: aquamarine5 && aquamarine5_@outlook.com
 * Copyright (c) 2024 by @aquamarine5, RC. All Rights Reversed.
 */

import { generateUUID } from "three/src/math/MathUtils";

const API_KEY = "app-M8KEekiX8phP2VLQXL93dhHt"
const API_BASE_URL = "http://localhost/v1"

export class InteropPortalV3 {
    userId: string = generateUUID()

    async chat(message: string, conversationId: string | null = null): Promise<AsyncIterable<any>> {
        // 使用fetch API发送请求
        const response = await fetch(`${API_BASE_URL}/chat-messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                inputs: {},
                query: message,
                user: this.userId,
                response_mode: 'streaming',
                conversation_id: conversationId || undefined
            })
        });

        if (!response.ok || !response.body) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // 获取可读流
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        const dataQueue: any[] = [];
        let resolvePromise: ((result: any) => void) | null = null;
        let streamEnded = false;
        let buffer = ''; // 用于存储不完整的块

        // 创建处理函数
        const processStreamData = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        streamEnded = true;
                        if (resolvePromise) {
                            resolvePromise({ value: undefined, done: true });
                            resolvePromise = null;
                        }
                        break;
                    }

                    // 解码二进制数据
                    const text = decoder.decode(value, { stream: true });
                    buffer += text;

                    // 处理完整的事件块
                    const chunks = buffer.split('\n\n');
                    buffer = chunks.pop() || ''; // 最后一个可能是不完整的

                    for (const chunk of chunks) {
                        if (chunk.trim().startsWith('data: ')) {
                            try {
                                // 提取"data:"后面的JSON内容
                                const jsonStr = chunk.replace(/^data: /, '').trim();
                                if (jsonStr === '[DONE]') {
                                    continue; // 忽略结束标记，我们使用done=true表示结束
                                }

                                const parsedData = JSON.parse(jsonStr);

                                if (resolvePromise) {
                                    const resolve = resolvePromise;
                                    resolvePromise = null;
                                    resolve({ value: parsedData, done: false });
                                } else {
                                    dataQueue.push(parsedData);
                                }
                            } catch (e) {
                                console.warn('解析数据块失败:', e, chunk);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('读取流出错:', error);
                streamEnded = true;
                if (resolvePromise) {
                    resolvePromise({ value: undefined, done: true });
                }
            }
        };

        // 开始处理流数据
        processStreamData();

        return {
            [Symbol.asyncIterator]() {
                return {
                    next() {
                        if (dataQueue.length > 0) {
                            return Promise.resolve({
                                value: dataQueue.shift(),
                                done: false
                            });
                        }

                        if (streamEnded) {
                            return Promise.resolve({
                                value: undefined,
                                done: true
                            });
                        }

                        return new Promise(resolve => {
                            resolvePromise = resolve;
                        });
                    }
                }
            }
        }
    }
}