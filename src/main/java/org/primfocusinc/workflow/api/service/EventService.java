package org.primfocusinc.workflow.api.service;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class EventService {

    private final FirestoreService firestoreService;

    public EventService(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    public void save(String id, Map<String, Object> body) {

    }
}
