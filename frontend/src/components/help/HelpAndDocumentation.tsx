import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Grid,
  Paper,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Book as BookIcon,
  VideoLibrary as VideoIcon,
  Help as HelpIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

interface DocumentationSection {
  title: string;
  content: string;
  icon: React.ReactNode;
}

const HelpAndDocumentation: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | false>(false);

  const documentationSections: DocumentationSection[] = [
    {
      title: 'Getting Started',
      content: 'Learn the basics of using the parking management system, including user interface navigation and essential features.',
      icon: <BookIcon />,
    },
    {
      title: 'User Guide',
      content: 'Detailed instructions for all system features, including ticket management, payment processing, and reporting.',
      icon: <BookIcon />,
    },
    {
      title: 'Video Tutorials',
      content: 'Watch step-by-step video guides for common tasks and advanced features.',
      icon: <VideoIcon />,
    },
    {
      title: 'FAQ',
      content: 'Frequently asked questions and their answers about system usage and troubleshooting.',
      icon: <HelpIcon />,
    },
  ];

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleAccordionChange = (section: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpandedSection(isExpanded ? section : false);
  };

  const filteredSections = documentationSections.filter((section) =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div" gutterBottom>
          Help & Documentation
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            {filteredSections.map((section) => (
              <Accordion
                key={section.title}
                expanded={expandedSection === section.title}
                onChange={handleAccordionChange(section.title)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {section.icon}
                    <Typography>{section.title}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>{section.content}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Quick Links
              </Typography>
              <List>
                <ListItem button>
                  <ListItemIcon>
                    <BookIcon />
                  </ListItemIcon>
                  <ListItemText primary="User Manual" />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <VideoIcon />
                  </ListItemIcon>
                  <ListItemText primary="Video Tutorials" />
                </ListItem>
                <ListItem button>
                  <ListItemIcon>
                    <HelpIcon />
                  </ListItemIcon>
                  <ListItemText primary="Contact Support" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default HelpAndDocumentation; 