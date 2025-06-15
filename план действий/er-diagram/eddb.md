erDiagram
    %% Core User Management
    USERS {
        UUID id PK "Primary Key"
        VARCHAR username UK "Unique Username"
        VARCHAR email UK "Unique Email"
        VARCHAR password_hash "Encrypted Password"
        VARCHAR full_name "Display Name"
        TEXT avatar_url "Profile Picture URL"
        TEXT bio "User Biography"
        BOOLEAN is_email_verified "Email Verification Status"
        VARCHAR verification_token "Email Verification Token"
        VARCHAR reset_password_token "Password Reset Token"
        TIMESTAMP reset_password_expires "Reset Token Expiry"
        VARCHAR account_status "active/banned/deleted"
        BOOLEAN is_private "Private Profile Flag"
        TIMESTAMP last_login "Last Login Time"
        TIMESTAMP created_at "Account Creation"
        TIMESTAMP updated_at "Last Profile Update"
        BOOLEAN is_deleted "Soft Delete Flag"
    }

    %% Content Management
    POSTS {
        UUID id PK "Primary Key"
        UUID author_id FK "Post Author"
        TEXT content "Post Content"
        TEXT media_url "Media File URL"
        VARCHAR content_type "text/image/video/poll"
        VARCHAR visibility "public/followers/private"
        TIMESTAMP created_at "Publication Date"
        TIMESTAMP updated_at "Last Edit Date"
        BOOLEAN is_deleted "Soft Delete Flag"
    }

    COMMENTS {
        UUID id PK "Primary Key"
        UUID post_id FK "Related Post"
        UUID author_id FK "Comment Author"
        UUID parent_comment_id FK "Parent Comment (Replies)"
        TEXT content "Comment Text"
        TIMESTAMP created_at "Comment Date"
        TIMESTAMP updated_at "Last Edit Date"
        BOOLEAN is_deleted "Soft Delete Flag"
    }

    LIKES {
        UUID user_id FK "User Who Liked"
        UUID post_id FK "Liked Post"
        TIMESTAMP created_at "Like Timestamp"
    }

    %% Social Features
    FOLLOWS {
        UUID follower_id FK "Follower User"
        UUID followee_id FK "Followed User"
        BOOLEAN is_pending "Pending Request"
        TIMESTAMP created_at "Follow Date"
    }

    BLOCKS {
        UUID blocker_id FK "Blocking User"
        UUID blocked_id FK "Blocked User"
        TIMESTAMP created_at "Block Date"
    }

    %% Messaging System
    CONVERSATIONS {
        UUID id PK "Primary Key"
        BOOLEAN is_group "Group Chat Flag"
        VARCHAR title "Group Chat Name"
        TIMESTAMP created_at "Creation Date"
        TIMESTAMP updated_at "Last Activity"
    }

    CONVERSATION_PARTICIPANTS {
        UUID conversation_id FK "Conversation ID"
        UUID user_id FK "Participant User"
        TIMESTAMP joined_at "Join Date"
    }

    MESSAGES {
        UUID id PK "Primary Key"
        UUID conversation_id FK "Conversation ID"
        UUID sender_id FK "Message Sender"
        TEXT content "Message Content"
        TEXT media_url "Media Attachment"
        VARCHAR media_type "image/video/document"
        TIMESTAMP created_at "Send Time"
        BOOLEAN is_read "Read Status"
        BOOLEAN is_deleted "Soft Delete Flag"
    }

    %% Notification System
    NOTIFICATIONS {
        UUID id PK "Primary Key"
        UUID user_id FK "Notification Owner"
        VARCHAR type "like/comment/follow/message"
        UUID from_user_id FK "Notification Sender"
        UUID post_id FK "Related Post"
        JSONB data "Additional Data"
        BOOLEAN is_read "Read Status"
        TIMESTAMP created_at "Notification Time"
    }

    %% Content Organization
    TAGS {
        UUID id PK "Primary Key"
        VARCHAR name UK "Tag Name"
        TIMESTAMP created_at "Creation Date"
    }

    POST_TAGS {
        UUID post_id FK "Tagged Post"
        UUID tag_id FK "Applied Tag"
        TIMESTAMP created_at "Tag Date"
    }

    %% Analytics
    POST_VIEWS {
        UUID post_id FK "Viewed Post"
        UUID user_id FK "Viewer (nullable for guests)"
        TIMESTAMP created_at "View Timestamp"
    }

    %% Relationships
    USERS ||--o{ POSTS : "creates"
    USERS ||--o{ COMMENTS : "writes"
    USERS ||--o{ LIKES : "gives"
    USERS ||--o{ MESSAGES : "sends"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ NOTIFICATIONS : "triggers"
    USERS ||--o{ POST_VIEWS : "views"
    
    POSTS ||--o{ COMMENTS : "has"
    POSTS ||--o{ LIKES : "receives"
    POSTS ||--o{ POST_TAGS : "tagged_with"
    POSTS ||--o{ POST_VIEWS : "viewed"
    POSTS ||--o{ NOTIFICATIONS : "relates_to"
    
    COMMENTS ||--o{ COMMENTS : "replies_to"
    
    USERS ||--o{ FOLLOWS : "follows"
    USERS ||--o{ FOLLOWS : "followed_by"
    USERS ||--o{ BLOCKS : "blocks"
    USERS ||--o{ BLOCKS : "blocked_by"
    
    CONVERSATIONS ||--o{ MESSAGES : "contains"
    CONVERSATIONS ||--o{ CONVERSATION_PARTICIPANTS : "includes"
    USERS ||--o{ CONVERSATION_PARTICIPANTS : "participates_in"
    
    TAGS ||--o{ POST_TAGS : "applied_to"