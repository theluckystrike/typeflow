import SecurityUtils, { secureFetch } from "../utils/security";
// import { getCache, setCache, deleteCache } from "../utils/cache";

const API_BASE_URL = 'https://backend.belikenative.com';

async function getData<T>(endpoint: string): Promise<T> {
    // Validate endpoint
    const sanitizedEndpoint = SecurityUtils.sanitizeInput(endpoint);
    if (!sanitizedEndpoint || sanitizedEndpoint !== endpoint) {
        SecurityUtils.auditLog('INVALID_ENDPOINT', { endpoint });
        throw new Error('Invalid API endpoint');
    }

    // Rate limiting check
    if (!SecurityUtils.rateLimiter.checkLimit('api_get', 60, 60000)) {
        throw new Error('Rate limit exceeded for GET requests');
    }

    // const cached = await getCache(endpoint);
    // if (cached !== null && endpoint !== "auth/detail" && endpoint !== "shortcut/getAllShortcut") {
    //     return cached;
    // }
    
    const url = `${API_BASE_URL}/${sanitizedEndpoint}`;
    const response = await secureFetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Extension-Version': '1.4.0'
        }
    });

    if (endpoint === "profile") {
        console.log(response);
    }
    
    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `GET request failed: ${response.status}`;
        
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.err ?? errorMessage;
        } catch {
            // Use default error message if JSON parsing fails
        }
        
        SecurityUtils.auditLog('API_ERROR', { endpoint, status: response.status, error: errorMessage });
        throw new Error(errorMessage);
    }
    
    const data = await response.json();
    // if (endpoint !== "auth/detail" && endpoint !== "shortcut/getAllShortcut") {
    //     await setCache(endpoint, data);
    // }
    return data;
}

async function postData<T>(endpoint: string, data: any): Promise<T> {
    // Validate endpoint
    const sanitizedEndpoint = SecurityUtils.sanitizeInput(endpoint);
    if (!sanitizedEndpoint || sanitizedEndpoint !== endpoint) {
        SecurityUtils.auditLog('INVALID_ENDPOINT', { endpoint });
        throw new Error('Invalid API endpoint');
    }

    // Rate limiting check
    if (!SecurityUtils.rateLimiter.checkLimit('api_post', 30, 60000)) {
        throw new Error('Rate limit exceeded for POST requests');
    }

    // Validate and sanitize data
    if (data && typeof data === 'object') {
        // Deep sanitize object properties
        const sanitizedData = JSON.parse(JSON.stringify(data));
        for (const key in sanitizedData) {
            if (typeof sanitizedData[key] === 'string') {
                sanitizedData[key] = SecurityUtils.sanitizeInput(sanitizedData[key]);
            }
        }
        data = sanitizedData;
    }

    const url = `${API_BASE_URL}/${sanitizedEndpoint}`;
    const response = await secureFetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Extension-Version': '1.4.0'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `POST request failed: ${response.status}`;
        
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.err ?? errorMessage;
        } catch {
            // Use default error message if JSON parsing fails
        }
        
        SecurityUtils.auditLog('API_ERROR', { endpoint, status: response.status, error: errorMessage });
        throw new Error(errorMessage);
    }

    const result = await response.json();
    // await deleteCache(endpoint);
    return result;
}


async function updateData<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error((await response.json()).err ?? `PATCH request failed: ${response.status}`);
    }

    const result = await response.json();
    // await deleteCache(endpoint);
    return result;
}


async function deleteData<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error((await response.json()).err ?? `DELETE request failed: ${response.status}`);
    }

    const result = await response.json();
    // await deleteCache(endpoint);
    return result;
}


export { getData, postData, updateData, deleteData };
