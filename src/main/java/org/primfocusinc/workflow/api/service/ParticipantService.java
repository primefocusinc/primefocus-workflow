package org.primfocusinc.workflow.api.service;

import org.primfocusinc.workflow.api.error.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ParticipantService {

    private static final String PARTICIPANTS_COLLECTION = "participants";
    private final FirestoreService firestoreService;

    public ParticipantService(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    public String create(Map<String, Object> body) throws Exception {
        String id = UUID.randomUUID().toString();
        firestoreService.save(PARTICIPANTS_COLLECTION, id, body);
        return id;
    }

    public List<Map<String, Object>> findAll() throws Exception {
        return firestoreService.findAll(PARTICIPANTS_COLLECTION);
    }

    public Map<String, Object> findById(String id) throws Exception {
        Map<String, Object> participant = firestoreService.findById(PARTICIPANTS_COLLECTION, id);
        if (participant == null) {
            throw new ResourceNotFoundException("Participant not found: " + id);
        }
        return participant;
    }

    public void update(String id, Map<String, Object> body) throws Exception {
        findById(id);
        firestoreService.update(PARTICIPANTS_COLLECTION, id, body);
    }

    public void delete(String id) throws Exception {
        findById(id);
        firestoreService.delete(PARTICIPANTS_COLLECTION, id);
    }
}
