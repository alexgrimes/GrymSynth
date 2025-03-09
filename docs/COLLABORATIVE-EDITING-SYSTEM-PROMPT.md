# Collaborative Editing System Implementation Prompt

## Task Description

Implement the Collaborative Editing System for GrymSynth as outlined in the implementation plan (docs/IMPLEMENTATION-PLAN-2025-Q2.md). This should include:

1. Developing real-time synchronization for multi-user editing
2. Creating user presence and awareness features
3. Implementing permissions and access control
4. Adding communication and annotation tools
5. Integrating with existing Pattern Recognition and MIDI Generation systems

## Technical Requirements

1. **Real-time Synchronization**
   - Implement Operational Transformation or CRDT for conflict resolution
   - Create efficient delta-based updates for minimal data transfer
   - Develop robust error handling and recovery mechanisms
   - Implement version history and change tracking
   - Add offline editing with synchronization upon reconnection

2. **User Presence and Awareness**
   - Create visual indicators for user presence and activity
   - Implement cursor/selection sharing between collaborators
   - Add user avatars and identification in the interface
   - Develop activity feeds for recent changes
   - Implement notifications for important collaborative events

3. **Permissions and Access Control**
   - Create role-based access control (viewer, editor, admin)
   - Implement fine-grained permissions for specific project elements
   - Add invitation and sharing mechanisms
   - Develop audit logging for security and compliance
   - Implement content locking for critical edits

4. **Communication Tools**
   - Create in-app messaging for collaborators
   - Implement annotation and commenting on audio patterns
   - Add real-time audio/video communication
   - Develop shared whiteboards for brainstorming
   - Implement decision tracking and task assignment

5. **Integration with Existing Systems**
   - Connect collaborative editing to pattern recognition workflows
   - Implement shared MIDI editing capabilities
   - Create collaborative audio manipulation tools
   - Develop shared project settings and preferences
   - Add export/import of collaborative projects

## Implementation Approach

1. **Component Structure**
   - Create a CollaborationService for managing real-time connections
   - Implement UserPresence components for awareness features
   - Develop PermissionManager for access control
   - Add CommunicationTools components for messaging and annotations
   - Create CollaborativeEditors for pattern and MIDI manipulation

2. **Technical Considerations**
   - Use WebSockets or WebRTC for real-time communication
   - Implement a server-side component for persistence and authentication
   - Use JWT or similar for secure authentication
   - Leverage IndexedDB for offline capabilities
   - Implement efficient data structures for collaborative editing

3. **Testing Strategy**
   - Create multi-user test scenarios with simulated collaborators
   - Implement unit tests for conflict resolution algorithms
   - Develop integration tests for the complete collaborative system
   - Add performance tests for various network conditions
   - Test security measures with penetration testing

## Success Criteria

1. Multiple users can edit the same project simultaneously without conflicts
2. Users are aware of others' presence and actions in real-time
3. Permissions effectively control access to project resources
4. Communication tools enable effective collaboration
5. Integration with existing systems creates a seamless workflow
6. The system performs well under various network conditions

## Next Steps

After completing the Collaborative Editing System implementation, the next step will be to implement the Advanced Visualization System, which will provide enhanced visual representations of audio data, patterns, and collaborative activities to improve user understanding and interaction.

## Continuation Pattern

After completing and testing this implementation, please create a new prompt for the next step in the implementation plan (Advanced Visualization System), and include instructions to continue this pattern of creating new task prompts until the core vision is fully implemented.
