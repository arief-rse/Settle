import React, { useState } from 'react';
import { migrateUserDocuments } from '../../../lib/firebase';
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

interface MigrationResults {
  success: number;
  failed: number;
}

const UserMigration: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<MigrationResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMigration = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const migrationResults = await migrateUserDocuments();
      setResults(migrationResults);
    } catch (error) {
      console.error('Migration failed:', error);
      setError(error instanceof Error ? error.message : 'Migration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Data Migration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          This will update all user documents to match the new structure.
        </div>

        {error && (
          <div className="text-sm text-destructive">
            {error}
          </div>
        )}

        {results && (
          <div className="text-sm space-y-2">
            <div className="text-green-600">
              Successfully migrated: {results.success} users
            </div>
            {results.failed > 0 && (
              <div className="text-destructive">
                Failed to migrate: {results.failed} users
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleMigration}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Migrating...' : 'Start Migration'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserMigration; 