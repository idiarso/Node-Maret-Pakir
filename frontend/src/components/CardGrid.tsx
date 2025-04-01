import React from 'react';
import { Grid, Card, CardContent, CardActions, Typography, Box } from '@mui/material';

interface CardGridProps<T> {
  items: T[];
  renderContent: (item: T) => React.ReactNode;
  renderActions?: (item: T) => React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  spacing?: number;
  emptyMessage?: string;
}

const CardGrid = <T extends { id: string | number }>({
  items,
  renderContent,
  renderActions,
  xs = 12,
  sm = 6,
  md = 4,
  lg = 3,
  xl = 3,
  spacing = 2,
  emptyMessage = 'No items found',
}: CardGridProps<T>) => {
  if (items.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200,
        }}
      >
        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={spacing}>
      {items.map((item) => (
        <Grid
          item
          xs={xs}
          sm={sm}
          md={md}
          lg={lg}
          xl={xl}
          key={item.id}
        >
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              {renderContent(item)}
            </CardContent>
            {renderActions && (
              <CardActions>
                {renderActions(item)}
              </CardActions>
            )}
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default CardGrid; 