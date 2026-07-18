package org.primfocusinc.workflow.api.service;

import org.primfocusinc.workflow.api.error.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class EventService {

    private static final String EVENTS_COLLECTION = "events";
    private final FirestoreService firestoreService;

    public EventService(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    public String create(Map<String, Object> body) throws Exception {
        String id = UUID.randomUUID().toString();
        firestoreService.save(EVENTS_COLLECTION, id, body);
        return id;
    }

    public List<Map<String, Object>> findAll() throws Exception {
        return firestoreService.findAll(EVENTS_COLLECTION);
    }

    public Map<String, Object> findById(String id) throws Exception {
        Map<String, Object> event = firestoreService.findById(EVENTS_COLLECTION, id);
        if (event == null) {
            throw new ResourceNotFoundException("Event not found: " + id);
        }
        return event;
    }

    public void update(String id, Map<String, Object> body) throws Exception {
        findById(id);
        firestoreService.update(EVENTS_COLLECTION, id, body);
    }

    public void delete(String id) throws Exception {
        findById(id);
        firestoreService.delete(EVENTS_COLLECTION, id);
    }
}
