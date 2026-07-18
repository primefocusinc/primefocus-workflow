package org.primfocusinc.workflow.api.service;

import org.primfocusinc.workflow.api.error.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class UserService {

    private static final String USERS_COLLECTION = "users";
    private final FirestoreService firestoreService;

    public UserService(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    public String create(Map<String, Object> body) throws Exception {
        String id = UUID.randomUUID().toString();
        firestoreService.save(USERS_COLLECTION, id, body);
        return id;
    }

    public List<Map<String, Object>> findAll() throws Exception {
        return firestoreService.findAll(USERS_COLLECTION);
    }

    public Map<String, Object> findById(String id) throws Exception {
        Map<String, Object> user = firestoreService.findById(USERS_COLLECTION, id);
        if (user == null) {
            throw new ResourceNotFoundException("User not found: " + id);
        }
        return user;
    }

    public void update(String id, Map<String, Object> body) throws Exception {
        findById(id);
        firestoreService.update(USERS_COLLECTION, id, body);
    }

    public void delete(String id) throws Exception {
        findById(id);
        firestoreService.delete(USERS_COLLECTION, id);
    }
}
