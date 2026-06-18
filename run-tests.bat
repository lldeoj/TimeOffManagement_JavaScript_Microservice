@echo off
REM Test execution script for Windows

setlocal enabledelayedexpansion

set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

echo %BLUE%================================================%NC%
echo %BLUE%Time-Off Microservice - Test Suite%NC%
echo %BLUE%================================================%NC%
echo.

if "%1"=="" goto local
if "%1"=="local" goto local
if "%1"=="docker" goto docker
if "%1"=="coverage" goto coverage
if "%1"=="help" goto help
goto unknown

:local
echo %BLUE%Running tests locally...%NC%
echo.

set FAILED=0

cd publisher-api
if not exist "node_modules" (
    echo %YELLOW%Installing Publisher API dependencies...%NC%
    call npm ci >nul
)
echo %YELLOW%Running Publisher API tests...%NC%
call npm test
if errorlevel 1 set FAILED=1
echo %GREEN%Publisher API tests completed%NC%
echo.
cd ..

cd consumer-service
if not exist "node_modules" (
    echo %YELLOW%Installing Consumer Service dependencies...%NC%
    call npm ci >nul
)
echo %YELLOW%Running Consumer Service tests...%NC%
call npm test
if errorlevel 1 set FAILED=1
echo %GREEN%Consumer Service tests completed%NC%
echo.
cd ..

echo %BLUE%================================================%NC%
echo %BLUE%Test Summary%NC%
echo %BLUE%================================================%NC%
if %FAILED%==0 (
    echo %GREEN%All tests PASSED! 🎉%NC%
    exit /b 0
) else (
    echo %RED%Some tests FAILED!%NC%
    exit /b 1
)

:docker
echo %BLUE%Running tests in Docker...%NC%
echo.
docker-compose -f docker-compose.test.yml build
docker-compose -f docker-compose.test.yml up
docker-compose -f docker-compose.test.yml down
goto end

:coverage
echo %BLUE%Generating coverage reports...%NC%
echo.
cd publisher-api
if not exist "node_modules" call npm ci >nul
echo %YELLOW%Publisher API coverage...%NC%
call npm test -- --coverage
echo %GREEN%Coverage report: publisher-api/coverage/index.html%NC%
cd ..
echo.
cd consumer-service
if not exist "node_modules" call npm ci >nul
echo %YELLOW%Consumer Service coverage...%NC%
call npm test -- --coverage
echo %GREEN%Coverage report: consumer-service/coverage/index.html%NC%
cd ..
goto end

:help
echo Usage: run-tests.bat [command]
echo.
echo Commands:
echo   local       - Run tests locally (default)
echo   docker      - Run tests in Docker containers
echo   coverage    - Generate coverage reports
echo   help        - Show this help message
echo.
echo Examples:
echo   run-tests.bat local
echo   run-tests.bat docker
echo   run-tests.bat coverage
goto end

:unknown
echo %RED%Unknown command: %1%NC%
echo Use 'run-tests.bat help' for usage information
exit /b 1

:end
endlocal
