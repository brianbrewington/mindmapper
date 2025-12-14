#!/bin/sh
echo "Running pre-commit verification..."

# Run Tests
echo "Running Tests..."
npm run test:run
if [ $? -ne 0 ]; then
    echo "Tests failed! Commit aborted."
    exit 1
fi

# Run Build
echo "Runnign Build..."
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed! Commit aborted."
    exit 1
fi

echo "All checks passed!"
exit 0
