library(plyr)

setwd('~/bikeshare-data-challenge')
tripdata <- read.csv('tripdata.csv')

# maximum number of clusters
maxk <- 10

tot.withinss <- rep(NA, maxk)

for (k in 2:maxk) {
  # perform the clustering by accessibility ratios. No need to rescale as these are already unitless
  km <- kmeans(tripdata[,c('jobs10', 'jobs30', 'jobs60', 'population10', 'population30', 'population60', 'bike30')],
         k,nstart=20)
  tot.withinss[k] <- km$tot.withinss
}

plot(2:maxk, tot.withinss[2:maxk], ylab='Total within sum of squares', xlab='Number of clusters', main='Cluster selection', type='b')

# 3 looks pretty good
km <- kmeans(tripdata[,c('jobs10', 'jobs30', 'jobs60', 'population10', 'population30', 'population60', 'bike30')],
             3,nstart=20)

tripdata$cluster <- km$cluster

# summarize the data
data <- ddply(tripdata, c('cluster'), summarise,
      mean.jobs10=mean(jobs10),
      sd.jobs10=sd(jobs10),
      conf.jobs10=sd(jobs10)/sqrt(length(jobs10)) * qt(.975, length(jobs10) - 1),
      n.jobs10=length(jobs10),
      
      mean.jobs30=mean(jobs30),
      sd.jobs30=sd(jobs30),
      conf.jobs30=sd(jobs30)/sqrt(length(jobs30)) * qt(.975, length(jobs30) - 1),
      n.jobs30=length(jobs30),
      
      mean.jobs60=mean(jobs60),
      sd.jobs60=sd(jobs60),
      conf.jobs60=sd(jobs60)/sqrt(length(jobs60)) * qt(.975, length(jobs60) - 1),
      n.jobs60=length(jobs60),
      
      mean.population10=mean(population10),
      sd.population10=sd(population10),
      conf.population10=sd(population10)/sqrt(length(population10)) * qt(.975, length(population10) - 1),
      n.population10=length(population10),
      
      mean.population30=mean(population30),
      sd.population30=sd(population30),
      conf.population30=sd(population30)/sqrt(length(population30)) * qt(.975, length(population30) - 1),
      n.population30=length(population30),
      
      mean.population60=mean(population60),
      sd.population60=sd(population60),
      conf.population60=sd(population60)/sqrt(length(population60)) * qt(.975, length(population60) - 1),
      n.population60=length(population60),
      
      mean.bike30=mean(bike30),
      sd.bike30=sd(bike30),
      conf.bike30=sd(bike30)/sqrt(length(bike30)) * qt(.975, length(bike30) - 1),
      n.bike30=length(bike30),
      
      p.weekend=sum(weekend=='True')/length(weekend),
      # 1.96: two-tailed critical value for normal distribution
      conf.weekend=sqrt(p.weekend * (1-p.weekend)/length(weekend))*1.96,
      n.weekend=length(weekend),
      
      p.casual=sum(casual=='True')/length(casual),
      # 1.96: two-tailed critical value for normal distribution
      conf.casual=sqrt(p.casual * (1-p.casual)/length(casual))*1.96,
      n.casual=length(casual)
)

# save the data for visualization
write.csv(data, 'data.csv')