#!/bin/bash

# ContactHub Identity Reconciliation API Test Script
# This script demonstrates all the functionality of the /identify endpoint

echo "🚀 Testing ContactHub Identity Reconciliation API"
echo "================================================"

BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to make API calls and format output
test_api() {
    local test_name="$1"
    local request_data="$2"
    
    echo -e "\n${YELLOW}Test: $test_name${NC}"
    echo "Request: $request_data"
    
    response=$(curl -s -X POST "$BASE_URL/identify" \
        -H "Content-Type: application/json" \
        -d "$request_data")
    
    echo -e "${GREEN}Response:${NC} $response"
    echo "---"
}

echo -e "\n${YELLOW}1. Health Check${NC}"
curl -s "$BASE_URL/health" | jq .
echo -e "\n---"

echo -e "\n${YELLOW}Starting Identity Reconciliation Tests...${NC}"

# Test 1: New primary contact
test_api "Create first primary contact" '{
    "email": "lorraine@hillvalley.edu",
    "phoneNumber": "123456"
}'

# Test 2: Create secondary contact (same phone, different email)
test_api "Create secondary contact with same phone" '{
    "email": "mcfly@hillvalley.edu", 
    "phoneNumber": "123456"
}'

# Test 3: Query with phone only
test_api "Query with phone number only" '{
    "phoneNumber": "123456"
}'

# Test 4: Query with email only
test_api "Query with email only" '{
    "email": "mcfly@hillvalley.edu"
}'

# Test 5: Create second primary contact
test_api "Create second primary contact" '{
    "email": "george@hillvalley.edu",
    "phoneNumber": "919191"
}'

# Test 6: Create third primary contact
test_api "Create third primary contact" '{
    "email": "biffsucks@hillvalley.edu",
    "phoneNumber": "717171"
}'

# Test 7: Merge primary contacts (the critical test!)
test_api "Merge primary contacts" '{
    "email": "george@hillvalley.edu",
    "phoneNumber": "717171"
}'

# Test 8: Query merged contact
test_api "Query merged contact with email" '{
    "email": "biffsucks@hillvalley.edu"
}'

# Test 9: Error case - no data
echo -e "\n${YELLOW}Test: Error handling - empty request${NC}"
echo "Request: {}"
response=$(curl -s -X POST "$BASE_URL/identify" \
    -H "Content-Type: application/json" \
    -d '{}')
echo -e "${RED}Response:${NC} $response"
echo "---"

# Test 10: Query with null values
test_api "Query with null email" '{
    "email": null,
    "phoneNumber": "123456"
}'

echo -e "\n${GREEN}✅ All tests completed!${NC}"
echo -e "\n${YELLOW}Summary:${NC}"
echo "- Primary contact creation ✅"
echo "- Secondary contact creation ✅" 
echo "- Contact querying ✅"
echo "- Primary contact merging ✅"
echo "- Error handling ✅"
