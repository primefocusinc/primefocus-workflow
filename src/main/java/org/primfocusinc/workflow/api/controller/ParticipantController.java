package org.primfocusinc.workflow.api.controller;

import org.primfocusinc.workflow.api.service.ParticipantService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/registration")
public class ParticipantController {

    private final ParticipantService participantService;

    public ParticipantController(ParticipantService participantService) {
        this.participantService = participantService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createParticipant( @PathVariable String id,
            @RequestBody Map<String, Object> body) throws Exception{
        participantService.save(id,body);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

}
