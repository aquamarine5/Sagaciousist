package org.aquarngd.sagaciousist.ttsbridge;

import com.alibaba.fastjson2.JSONObject;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
public class TtsBridgeController {
    @PostMapping("/tts")
    public JSONObject executeTTS(@RequestParam String text){
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.po
    }
}
