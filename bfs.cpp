#include <iostream>
#include <vector>
#include <queue>
using namespace std;

int main() {

    int n;

    // Number of vertices
    cout << "Enter number of vertices: ";
    cin >> n;

    // Adjacency matrix
    vector<vector<int>> graph(n, vector<int>(n));

    cout << "Enter adjacency matrix:\n";

    for(int i = 0; i < n; i++) {
        for(int j = 0; j < n; j++) {
            cin >> graph[i][j];
        }
    }

    int start;

    cout << "Enter starting vertex: ";
    cin >> start;

    // Visited array
    vector<bool> visited(n, false);

    // Queue for BFS
    queue<int> q;

    // Start node visited
    visited[start] = true;

    // Push start node
    q.push(start);

    cout << "BFS Traversal: ";

    while(!q.empty()) {

        // Front node
        int node = q.front();

        // Remove node
        q.pop();

        // Print node
        cout << node << " ";

        // Check neighbors
        for(int i = 0; i < n; i++) {

            // If connected and not visited
            if(graph[node][i] == 1 && !visited[i]) {

                visited[i] = true;

                q.push(i);
            }
        }
    }

    return 0;
}