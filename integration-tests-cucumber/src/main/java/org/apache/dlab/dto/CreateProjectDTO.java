package org.apache.dlab.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Set;

@Data
@AllArgsConstructor
public class CreateProjectDTO {
    private String name;
    private Set<String> groups;
    private Set<String> endpoints;
    private String key;
    private String tag;
    @JsonProperty("shared_image_enabled")
    private boolean sharedImageEnabled;
}
