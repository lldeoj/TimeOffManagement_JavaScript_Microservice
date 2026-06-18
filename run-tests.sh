#!/bin/bash

# Test execution script for Time-Off Microservice

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Time-Off Microservice - Test Suite${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Functions
run_tests() {
    local service=$1
    local path=$2
    
    echo -e "${YELLOW}Running tests for ${service}...${NC}"
    
    if [ -d "${path}" ]; then
        cd "${path}"
        
        if [ ! -d "node_modules" ]; then
            echo -e "${YELLOW}Installing dependencies...${NC}"
            npm ci > /dev/null
        fi
        
        echo -e "${YELLOW}Executing tests...${NC}"
        if npm test 2>&1; then
            echo -e "${GREEN}✓ ${service} tests passed${NC}\n"
            return 0
        else
            echo -e "${RED}✗ ${service} tests failed${NC}\n"
            return 1
        fi
    else
        echo -e "${RED}✗ ${path} not found${NC}\n"
        return 1
    fi
}

run_docker_tests() {
    echo -e "${YELLOW}Running tests in Docker...${NC}"
    docker-compose -f docker-compose.test.yml build
    docker-compose -f docker-compose.test.yml up
    docker-compose -f docker-compose.test.yml down
}

# Parse arguments
case "${1:-local}" in
    local)
        echo -e "${BLUE}Running tests locally...${NC}\n"
        
        PUBLISHER_FAILED=0
        CONSUMER_FAILED=0
        
        if ! run_tests "Publisher API" "./publisher-api"; then
            PUBLISHER_FAILED=1
        fi
        
        if ! run_tests "Consumer Service" "./consumer-service"; then
            CONSUMER_FAILED=1
        fi
        
        echo -e "${BLUE}================================================${NC}"
        echo -e "${BLUE}Test Summary${NC}"
        echo -e "${BLUE}================================================${NC}"
        
        if [ $PUBLISHER_FAILED -eq 0 ]; then
            echo -e "${GREEN}✓ Publisher API: PASSED${NC}"
        else
            echo -e "${RED}✗ Publisher API: FAILED${NC}"
        fi
        
        if [ $CONSUMER_FAILED -eq 0 ]; then
            echo -e "${GREEN}✓ Consumer Service: PASSED${NC}"
        else
            echo -e "${RED}✗ Consumer Service: FAILED${NC}"
        fi
        
        echo -e "${BLUE}================================================${NC}\n"
        
        if [ $PUBLISHER_FAILED -eq 0 ] && [ $CONSUMER_FAILED -eq 0 ]; then
            echo -e "${GREEN}All tests PASSED! 🎉${NC}\n"
            exit 0
        else
            echo -e "${RED}Some tests FAILED! ❌${NC}\n"
            exit 1
        fi
        ;;
        
    docker)
        echo -e "${BLUE}Running tests in Docker containers...${NC}\n"
        run_docker_tests
        ;;
        
    coverage)
        echo -e "${BLUE}Generating coverage reports...${NC}\n"
        
        cd publisher-api
        npm ci > /dev/null
        npm test -- --coverage
        echo -e "${GREEN}Publisher API coverage: ./publisher-api/coverage/index.html${NC}\n"
        cd ..
        
        cd consumer-service
        npm ci > /dev/null
        npm test -- --coverage
        echo -e "${GREEN}Consumer Service coverage: ./consumer-service/coverage/index.html${NC}\n"
        cd ..
        ;;
        
    watch)
        echo -e "${BLUE}Running tests in watch mode...${NC}\n"
        cd "${2:-publisher-api}"
        npm ci > /dev/null
        npm run test:watch
        ;;
        
    unit)
        echo -e "${BLUE}Running unit tests only...${NC}\n"
        cd publisher-api
        npm ci > /dev/null
        npm run test:unit
        ;;
        
    integration)
        echo -e "${BLUE}Running integration tests only...${NC}\n"
        cd publisher-api
        npm ci > /dev/null
        npm run test:integration
        ;;
        
    help|--help|-h)
        echo "Usage: ./run-tests.sh [command]"
        echo ""
        echo "Commands:"
        echo "  local       - Run tests locally (default)"
        echo "  docker      - Run tests in Docker containers"
        echo "  coverage    - Generate coverage reports"
        echo "  watch       - Run tests in watch mode"
        echo "  unit        - Run unit tests only"
        echo "  integration - Run integration tests only"
        echo "  help        - Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./run-tests.sh local"
        echo "  ./run-tests.sh docker"
        echo "  ./run-tests.sh coverage"
        ;;
        
    *)
        echo -e "${RED}Unknown command: ${1}${NC}"
        echo "Use './run-tests.sh help' for usage information"
        exit 1
        ;;
esac
